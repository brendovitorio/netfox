import { GetServerSideProps } from 'next';

export default function LegacyMoviePage() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const id = Array.isArray(context.params?.id) ? context.params?.id[0] : context.params?.id;

  if (!id) return { notFound: true };

  return {
    redirect: {
      destination: `/watch/movie/${id}`,
      permanent: true,
    },
  };
};
